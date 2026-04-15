import os

path = 'frontend/desktop/src/components/Layout/AppLayout.tsx'
with open(path, 'r') as f:
    content = f.read()

admin_check = "const isAdmin = ['ravel@mboa.com', 'tchinda@mboa.com', 'william@mboa.com'].includes(user?.email || '');"
if 'const isAdmin =' not in content:
    content = content.replace("const navigate = useNavigate();", f"const navigate = useNavigate();\n  {admin_check}")

nav_item = """          {isAdmin && (
            <NavLink to='/admin' className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <ShieldCheck size={20} />
              <span>Admin</span>
            </NavLink>
          )}"""
if "to='/admin'" not in content:
    content = content.replace("<NavLink to='/history'", f"{nav_item}\n          <NavLink to='/history'")

if "ShieldCheck" not in content:
    content = content.replace("Settings, LogOut, Cloud", "Settings, LogOut, Cloud, ShieldCheck")

with open(path, 'w') as f:
    f.write(content)
