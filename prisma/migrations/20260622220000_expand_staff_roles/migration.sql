ALTER TABLE "User" DROP CONSTRAINT "User_role_adminRole_consistency";

CREATE TYPE "AdminStaffRole_new" AS ENUM (
  'OWNER',
  'ADMIN',
  'SUB_ADMIN',
  'MANAGER',
  'TEACHER'
);

ALTER TABLE "User"
ALTER COLUMN "adminRole" TYPE "AdminStaffRole_new"
USING (
  CASE "adminRole"::text
    WHEN 'SUPER_ADMIN' THEN 'OWNER'
    WHEN 'CONTENT_MANAGER' THEN 'MANAGER'
    WHEN 'SUPPORT_STAFF' THEN 'SUB_ADMIN'
    ELSE NULL
  END
)::"AdminStaffRole_new";

DROP TYPE "AdminStaffRole";
ALTER TYPE "AdminStaffRole_new" RENAME TO "AdminStaffRole";

ALTER TABLE "User"
ADD CONSTRAINT "User_role_adminRole_consistency"
CHECK (
  (
    "role" = 'STUDENT'::"UserRole"
    AND "adminRole" IS NULL
    AND cardinality("permissions") = 0
  )
  OR
  (
    "role" = 'ADMIN'::"UserRole"
    AND "adminRole" IS NOT NULL
  )
);
