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
