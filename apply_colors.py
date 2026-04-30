import os

# Define the color mapping: orange -> cyan, amber -> sky
replacements = {
    'orange-50': 'cyan-50',
    'orange-100': 'cyan-100',
    'orange-200': 'cyan-200',
    'orange-300': 'cyan-300',
    'orange-400': 'cyan-400',
    'orange-500': 'cyan-500',
    'orange-600': 'cyan-600',
    'orange-700': 'cyan-700',
    'orange-800': 'cyan-800',
    'orange-900': 'cyan-900',
    'amber-50': 'sky-50',
    'amber-100': 'sky-100',
    'amber-200': 'sky-200',
    'amber-300': 'sky-300',
    'amber-400': 'sky-400',
    'amber-500': 'sky-500',
    'amber-600': 'sky-600',
    'amber-700': 'sky-700',
    'amber-800': 'sky-800',
}

src_dir = '/home/z/my-project/src'
files_processed = []

for root, dirs, files in os.walk(src_dir):
    for fname in files:
        if not (fname.endswith('.tsx') or fname.endswith('.ts')):
            continue
        
        fpath = os.path.join(root, fname)
        
        try:
            with open(fpath, 'r') as f:
                content = f.read()
        except:
            continue
        
        original = content
        for old_color, new_color in replacements.items():
            content = content.replace(old_color, new_color)
        
        if content != original:
            try:
                with open(fpath, 'w') as f:
                    f.write(content)
                files_processed.append(fpath.replace(src_dir + '/', ''))
            except:
                print(f"FAILED to write: {fpath}")

print(f"Updated {len(files_processed)} files:")
for f in sorted(files_processed):
    print(f"  ✓ {f}")
