import os

path = 'frontend/desktop/src/components/Layout/AppLayout.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    new_lines.append(line)
    if "<NavLink to=\"/history\"" in line:
        new_lines.append("          {isAdmin && (\n")
        new_lines.append("            <NavLink to=\"/admin\" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>\n")
        new_lines.append("              <ShieldCheck size={20} />\n")
        new_lines.append("              <span>Admin</span>\n")
        new_lines.append("            </NavLink>\n")
        new_lines.append("          )}\n")

with open(path, 'w') as f:
    f.writelines(new_lines)
