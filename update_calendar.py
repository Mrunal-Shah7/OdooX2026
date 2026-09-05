import re

with open('web/src/pages/timeoff/YearCalendar.tsx', 'r') as f:
    content = f.read()

# We need to change the header loop to 37 columns and the body loop to 37 columns.
header_replacement = """
              {Array.from({ length: 37 }, (_, i) => (
                <th key={i} className="w-7 px-1 py-1 font-mono text-caption font-semibold">
                  {WEEKDAY_LETTERS[i % 7]}
                </th>
              ))}
"""

content = re.sub(r'\{Array\.from\(\{\s*length:\s*31\s*\}, \(_, i\) => \(\s*<th key=\{i \+ 1\}[^>]*>\s*\{WEEKDAY_LETTERS\[i % 7\]\}\s*</th>\s*\)\)\}', header_replacement.strip(), content)

body_replacement = """
                  {Array.from({ length: 37 }, (_, dIdx) => {
                    const firstDayOfMonth = new Date(year, mIdx, 1);
                    // 0 is Sunday, 1 is Monday... map to 0=Mon, ..., 6=Sun
                    const offset = (firstDayOfMonth.getDay() + 6) % 7;
                    const dayNum = dIdx - offset + 1;

                    if (dayNum < 1 || dayNum > daysInMonth) {
                      return <td key={dIdx} className="p-0.5 bg-canvas/30" />;
                    }

                    const dateStr = `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const dayData = dayMap.get(dateStr);
"""

content = re.sub(r'\{Array\.from\(\{\s*length:\s*31\s*\}, \(_, dIdx\) => \{\s*const dayNum = dIdx \+ 1;\s*if \(dayNum > daysInMonth\) \{\s*return <td key=\{dayNum\} className="p\.0\.5 bg-canvas/30" />;\s*\}\s*const dateStr = `\$\{year\}-\$\{String\(mIdx \+ 1\)\.padStart\(2, \'0\'\)\}-\$\{String\(dayNum\)\.padStart\(2, \'0\'\)\}`; \s*const dayData = dayMap\.get\(dateStr\);', body_replacement.strip(), content)

content = content.replace('key={dayNum} className="p-0.5"', 'key={dIdx} className="p-0.5"')
content = content.replace('if (dayNum > daysInMonth) {\n                      return <td key={dayNum} className="p-0.5 bg-canvas/30" />;\n                    }', '')

with open('web/src/pages/timeoff/YearCalendar.tsx', 'w') as f:
    f.write(content)
