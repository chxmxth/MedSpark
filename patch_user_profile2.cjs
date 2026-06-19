const fs = require('fs');

const path = 'src/components/UserProfileSettings.tsx';
let content = fs.readFileSync(path, 'utf8');

const topicsState = `
  const [topics, setTopics] = useState<string[]>(profile.topics || []);
  const [newTopic, setNewTopic] = useState("");
`;

const handleSave = `
              onClick={() => {
                if (isEditing) {
                  onChangeProfile({
                    ...profile,
                    firstName,
                    lastName,
                    email: emailInput,
                    topics
                  });
                }
                setIsEditing(!isEditing);
              }}
`;

const topicSection = `
            {/* Custom Topics Area */}
            <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-800/60 mt-2">
              <label className="font-bold font-mono tracking-wide uppercase text-slate-500 flex justify-between items-center">
                Custom OSCE Topics
                <span className="text-[10px] text-emerald-500/70 lowercase font-sans">used for dynamic case generation</span>
              </label>

              <div className="flex gap-2">
                <input
                  disabled={!isEditing}
                  placeholder="e.g. Cardiology, Acute Stroke"
                  className="flex-grow p-2.5 bg-[#050608] border border-slate-800/80 rounded-lg disabled:opacity-60 focus:bg-[#050608] focus:border-emerald-500/50 outline-none font-bold text-slate-100 placeholder:text-slate-700"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTopic.trim() && isEditing) {
                      e.preventDefault();
                      setTopics([...topics, newTopic.trim()]);
                      setNewTopic("");
                    }
                  }}
                />
                <button
                  disabled={!isEditing || !newTopic.trim()}
                  onClick={() => {
                    setTopics([...topics, newTopic.trim()]);
                    setNewTopic("");
                  }}
                  className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold font-mono uppercase text-[10px] rounded-lg disabled:opacity-50 hover:bg-emerald-500/20 transition-colors"
                >
                  Add
                </button>
              </div>

              {topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {topics.map((t, idx) => (
                    <span key={idx} className="bg-slate-900 border border-slate-700/50 text-slate-300 px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5">
                      {t}
                      {isEditing && (
                        <button
                          onClick={() => setTopics(topics.filter((_, i) => i !== idx))}
                          className="text-rose-500/70 hover:text-rose-400 focus:outline-none"
                        >
                          &times;
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
`;


content = content.replace('const [lastName, setLastName] = useState(profile.lastName);', 'const [lastName, setLastName] = useState(profile.lastName);\n' + topicsState);

content = content.replace(/              onClick=\{\(\) => \{[\s\S]*?if \(isEditing\) \{[\s\S]*?onChangeProfile\(\{[\s\S]*?\.\.\.profile,[\s\S]*?firstName,[\s\S]*?lastName,[\s\S]*?email: emailInput[\s\S]*?\}\);[\s\S]*?\}[\s\S]*?setIsEditing\(\!isEditing\);[\s\S]*?\}\}/, handleSave);

content = content.replace('</div>\n        </div>\n\n      </div>', topicSection + '          </div>\n        </div>\n\n      </div>');

fs.writeFileSync(path, content);
console.log("Updated Profile Settings");
