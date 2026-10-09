import { useCallback, useState } from "react";

import { COUNSELLING_FILES_PER_BATCH, counsellingFileProblem } from "@/lib/counselling/files";
import { fileFingerprint, shareCounsellingFiles, type ShareResult } from "@/lib/counselling/share-files-client";

export type StagedFile = {
  key: string;
  file: File;
  /** Upload progress while sharing, 0–100. */
  percent: number | null;
};

/**
 * Files picked for a counselling session but not shared yet — like attaching
 * files in a chat: they can be reviewed and removed before anything is sent.
 */
export function useStagedFiles(bookingId: string) {
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [sharing, setSharing] = useState(false);

  /** Adds picked files; returns messages for any that were skipped. */
  const add = useCallback(
    (list: FileList | File[] | null) => {
      const problems: string[] = [];
      const next = [...staged];
      for (const file of Array.from(list ?? [])) {
        const problem = counsellingFileProblem(file);
        if (problem) {
          problems.push(problem);
          continue;
        }
        const key = fileFingerprint(file);
        if (next.some((item) => item.key === key)) continue; // already picked
        if (next.length >= COUNSELLING_FILES_PER_BATCH) {
          problems.push(`You can share up to ${COUNSELLING_FILES_PER_BATCH} files at a time.`);
          break;
        }
        next.push({ key, file, percent: null });
      }
      setStaged(next);
      return problems;
    },
    [staged],
  );

  const remove = useCallback((key: string) => {
    setStaged((current) => current.filter((item) => item.key !== key));
  }, []);

  const clear = useCallback(() => setStaged([]), []);

  /** Uploads every staged file; keeps them staged if nothing could be shared. */
  const share = useCallback(async (): Promise<ShareResult | null> => {
    if (staged.length === 0) return null;
    setSharing(true);
    const result = await shareCounsellingFiles(
      bookingId,
      staged.map((item) => item.file),
      (index, percent) =>
        setStaged((current) =>
          current.map((item, i) => (i === index ? { ...item, percent } : item)),
        ),
    );
    setSharing(false);
    if (result.shared > 0) {
      setStaged([]);
    } else {
      // Nothing was saved: keep the files so the user can retry.
      setStaged((current) => current.map((item) => ({ ...item, percent: null })));
    }
    return result;
  }, [bookingId, staged]);

  return { staged, sharing, add, remove, clear, share };
}
