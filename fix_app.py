import os

path = 'frontend/desktop/src/App.tsx'
with open(path, 'r') as f:
    content = f.read()

import_admin = "import AdminDashboard from './pages/Admin/AdminDashboard';"
if "import AdminDashboard" not in content:
    content = content.replace("import Terms from './pages/Legal/Terms';", f"import Terms from './pages/Legal/Terms';\n{import_admin}")

admin_route = """        <Route path="/admin" element={
          <ProtectedRoute>
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          </ProtectedRoute>
        } />"""

if 'path="/admin"' not in content:
    content = content.replace('<Route path="/settings"', f'{admin_route}\n        <Route path="/settings"')

with open(path, 'w') as f:
    f.write(content)
