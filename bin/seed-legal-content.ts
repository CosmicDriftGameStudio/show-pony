import {
  type LegalContentBlock,
  seedLegalContentFromJson,
} from "@cosmicdrift/kumiko-bundled-features/template-resolver/seeding";
import type { DbConnection } from "@cosmicdrift/kumiko-framework/db";
import legalContent from "../src/generated/legal-content.json";

const blocks: readonly LegalContentBlock[] = legalContent;

export async function seedLegalContent(db: DbConnection): Promise<void> {
  await seedLegalContentFromJson(db, blocks);
}
