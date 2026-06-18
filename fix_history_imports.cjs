const fs = require('fs');
let content = fs.readFileSync('src/components/HistoryFeed.tsx', 'utf8');

content = content.replace(/import \{ \n  Award, \n  Layers, \n  Calendar, \n  ChevronRight, \n  Search, \n  Sparkles, \n  CheckCircle, \n  AlertTriangle,\n  Clipboard,\n  Sliders,\n  Filter,\n  Lock,\n  Shield,\n  Target\n\} from "lucide-react";\n  Clipboard,\n  Sliders,\n  Filter,\n  Lock,\n  Shield\n\} from "lucide-react";/, `import { useState } from "react";\nimport { CaseEvaluation } from "../types";\nimport { \n  Award, \n  Layers, \n  Calendar, \n  ChevronRight, \n  Search, \n  Sparkles, \n  CheckCircle, \n  AlertTriangle,\n  Clipboard,\n  Sliders,\n  Filter,\n  Lock,\n  Shield,\n  Target\n} from "lucide-react";`);

fs.writeFileSync('src/components/HistoryFeed.tsx', content);
