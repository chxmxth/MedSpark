1. **Define Module-Level Variable for RevenueCat Initialization**
   - In `src/App.tsx`, outside the component, define `let isRevenueCatConfigured = false;`.

2. **Update RevenueCat Initialization Logic in `App.tsx`**
   - Inside `auth.onAuthStateChanged`, check if `isRevenueCatConfigured` is false.
   - If `false`, execute the current logic to fetch keys and configure `Purchases` and `PurchasesWeb` using the provided `appUserId`.
   - Set `isRevenueCatConfigured = true;`.
   - If `true`, handle login/logout logic:
     - Check the platform context.
     - If `firebaseUser` exists (logged in):
       - For native platforms: `Purchases.logIn({ appUserID: firebaseUser.uid })`
     - If `firebaseUser` is null (logged out):
       - For native platforms: `Purchases.logOut()`
       - (Note: The web SDK uses `PurchasesWeb.getSharedInstance().logIn()` / `logOut()`)

3. **Rename `decreaseAvailableCases`**
   - Rename `decreaseAvailableCases` to `hasAvailableCases` in:
     - `src/App.tsx`
     - `src/components/SimulatorLab.tsx`
     - `src/components/ParaClinicalLab.tsx`

4. **Rename `decreaseAssistantQueries`**
   - Rename `decreaseAssistantQueries` to `hasAssistantQueries` in:
     - `src/App.tsx`
     - `src/components/ClinicalAssistant.tsx`

5. **Complete pre commit steps**
   - Ensure proper testing, verification, review, and reflection are done.

6. **Submit the change.**
   - Once all checks pass, submit the change with a descriptive commit message.
