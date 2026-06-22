import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (e) {
  console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT. Make sure it's set in the environment variables.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// We need to know which database ID to use for firestore if it's not the default.
// In the project firebase-applet-config.json, they specified "firestoreDatabaseId": "ai-studio-ef4df47f-d392-4fc3-acfe-ad41edf66515"
// However, Firebase admin by default connects to the (default) database. We should configure the admin db correctly.
// A safe way is to attempt to use db as is or specify databaseId.
// The db initialization in admin SDK: admin.firestore({ databaseId: 'ai-studio-ef4df47f-d392-4fc3-acfe-ad41edf66515' }) is not fully standard in older versions, but let's assume default DB is what we need to query if not specified.
// For now we will use standard firestore connection. Wait, the frontend code explicitly did: getFirestore(app, firebaseConfig.firestoreDatabaseId);
// Let's ensure we use the same databaseId.
const DATABASE_ID = "ai-studio-ef4df47f-d392-4fc3-acfe-ad41edf66515";
const firestore = db;

// We can set databaseId when initializing if we use Firebase Admin Node SDK v12+
// let's just initialize firestore with databaseId since we will update the package version to v12+
const customDb = admin.firestore(); // default db
try {
   customDb.settings({ databaseId: DATABASE_ID }); // some versions support this. If not, we will rely on default if it fails.
} catch (e) {}

const UMLS_API_KEY = process.env.UMLS_API_KEY;

if (!UMLS_API_KEY) {
  console.warn("UMLS_API_KEY is not set. UMLS data will not be fetched.");
}

async function fetchOpenTargets(efoId) {
  const url = "https://api.platform.opentargets.org/api/v4/graphql";
  const query = `
    query disease($efoId: String!) {
      disease(efoId: $efoId) {
        id
        name
        description
        associatedTargets(page: {index: 0, size: 10}) {
          count
          rows {
            target {
              id
              approvedSymbol
              approvedName
            }
            score
          }
        }
      }
    }
  `;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { efoId } })
    });
    if (!res.ok) throw new Error(`OpenTargets HTTP error: ${res.status}`);
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching OpenTargets for ${efoId}:`, error);
    return null;
  }
}

async function fetchRxNav(drugName) {
  try {
    const searchUrl = `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(drugName)}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error(`RxNav HTTP error: ${searchRes.status}`);
    const searchData = await searchRes.json();

    let rxcui = null;
    if (searchData.drugGroup && searchData.drugGroup.conceptGroup) {
      for (const group of searchData.drugGroup.conceptGroup) {
        if (group.conceptProperties && group.conceptProperties.length > 0) {
          rxcui = group.conceptProperties[0].rxcui;
          break;
        }
      }
    }

    if (!rxcui) {
      return { searchData, classes: null };
    }

    const classUrl = `https://rxnav.nlm.nih.gov/REST/rxclass/class/byRxcui.json?rxcui=${rxcui}`;
    const classRes = await fetch(classUrl);
    const classData = classRes.ok ? await classRes.json() : null;

    return { searchData, classData, rxcui };
  } catch (error) {
    console.error(`Error fetching RxNav for ${drugName}:`, error);
    return null;
  }
}

async function fetchUMLS(diseaseName) {
  if (!UMLS_API_KEY) return null;
  try {
    const searchUrl = `https://uts-ws.nlm.nih.gov/rest/search/current?string=${encodeURIComponent(diseaseName)}&apiKey=${UMLS_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error(`UMLS HTTP error: ${searchRes.status}`);
    const searchData = await searchRes.json();

    if (searchData.result && searchData.result.results && searchData.result.results.length > 0) {
      const firstResult = searchData.result.results[0];
      const cui = firstResult.ui;

      const detailUrl = `https://uts-ws.nlm.nih.gov/rest/content/current/CUI/${cui}?apiKey=${UMLS_API_KEY}`;
      const detailRes = await fetch(detailUrl);
      const detailData = detailRes.ok ? await detailRes.json() : null;

      return { search: firstResult, details: detailData?.result };
    }
    return searchData;
  } catch (error) {
    console.error(`Error fetching UMLS for ${diseaseName}:`, error);
    return null;
  }
}

async function main() {
  const seedListPath = path.join(process.cwd(), 'scripts', 'diseaseSeedList.json');
  const seedList = JSON.parse(fs.readFileSync(seedListPath, 'utf8'));

  // Get cases
  // Note: we might be using default db or the specific database.
  // Let's get the firestore instance properly if the databaseId is needed.
  let targetDb;
  try {
      targetDb = admin.firestore(admin.app(), DATABASE_ID);
  } catch(e) {
      targetDb = admin.firestore(); // fallback
  }

  const casesRef = targetDb.collection('cases');
  const casesSnapshot = await casesRef.get();

  if (casesSnapshot.empty) {
    console.log("No cases found in the 'cases' collection.");
    process.exit(0);
  }

  for (const doc of casesSnapshot.docs) {
    const caseData = doc.data();
    const searchableText = [
      caseData.name,
      caseData.title,
      caseData.complaint,
      caseData.correctAnswers?.finalDiagnosis,
      ...(caseData.correctAnswers?.differential || [])
    ].filter(Boolean).join(" ").toLowerCase();

    for (const seed of seedList) {
      if (searchableText.includes(seed.disease.toLowerCase())) {
        console.log(`Found match for disease "${seed.disease}" in case "${doc.id}"`);

        console.log(`Fetching OpenTargets for ${seed.disease}...`);
        const opentargets_data = await fetchOpenTargets(seed.efoId);

        console.log(`Fetching RxNav for ${seed.drugName}...`);
        const rxnav_data = await fetchRxNav(seed.drugName);

        console.log(`Fetching UMLS for ${seed.disease}...`);
        const umls_data = await fetchUMLS(seed.disease);

        const updatePayload = {
          opentargets_data: opentargets_data || null,
          rxnav_data: rxnav_data || null,
          umls_data: umls_data || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await doc.ref.update(updatePayload);
        console.log(`Successfully updated case "${doc.id}" with paraclinical data.`);
        break; // Stop matching other seeds for this case if one matched (or continue if a case can have multiple, but break is safer)
      }
    }
  }

  console.log("Finished updating paraclinical data for all cases.");
}

main().catch(console.error);
