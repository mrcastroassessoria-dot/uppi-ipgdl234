const fs = require('fs');
const path = require('path');

// Files to migrate
const filesToMigrate = [
  'app/admin/analytics/page.tsx',
  'app/api/v1/achievements/route.ts',
  'app/api/v1/admin/setup/route.ts',
  'app/api/v1/coupons/route.ts',
  'app/api/v1/driver/documents/route.ts',
  'app/api/v1/driver/location/route.ts',
  'app/api/v1/driver/verify/route.ts',
  'app/api/v1/drivers/hot-zones/route.ts'
];

// Basic transformation patterns
const transforms = [
  {
    from: /import { createClient } from '@\/lib\/supabase\/server'/g,
    to: "import { getFirestoreAdmin, verifyAuthToken } from '@/lib/firebase/admin'"
  },
  {
    from: /import { createClient } from '@\/lib\/supabase\/client'/g,
    to: "import { getFirestore } from '@/lib/firebase/firestore'\nimport { useAuth } from '@/hooks/use-auth'"
  },
  {
    from: /const supabase = await createClient\(\)/g,
    to: 'const db = getFirestoreAdmin()'
  },
  {
    from: /const supabase = createClient\(\)/g,
    to: 'const db = getFirestore()'
  },
  {
    from: /const { data: { user }[^}]*} = await supabase\.auth\.getUser\(\)/g,
    to: 'const user = await verifyAuthToken(request)'
  }
];

// Apply all transforms to a file
function migrateFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  transforms.forEach(transform => {
    if (content.match(transform.from)) {
      content = content.replace(transform.from, transform.to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Migrated: ${filePath}`);
    return true;
  } else {
    console.log(`⏭️  Skipped (no changes): ${filePath}`);
    return false;
  }
}

// Run migration
console.log('🔥 Starting Firebase migration...\n');
let migratedCount = 0;

filesToMigrate.forEach(file => {
  if (migrateFile(file)) {
    migratedCount++;
  }
});

console.log(`\n✨ Migration complete! ${migratedCount}/${filesToMigrate.length} files migrated.`);
