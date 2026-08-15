import os, re
base_dir = "src"
replacements = 0
for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            original = content
            content = re.sub(r"'http://localhost:8000([^']*)'", r'`${import.meta.env.VITE_API_URL}\1`', content)
            content = re.sub(r'`http://localhost:8000([^`]*)`', r'`${import.meta.env.VITE_API_URL}\1`', content)
            if content != original:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print("Actualizado:", filepath)
                replacements += 1
print("Total archivos actualizados:", replacements)
