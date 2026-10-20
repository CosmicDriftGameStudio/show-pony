import type { TenantEditableTemplate } from "@cosmicdrift/kumiko-bundled-features/template-resolver";
import { RSVP_CONFIRMATION_TYPE } from "./lib/rsvp-confirmation-mail";

/** Only the guest-facing RSVP mail is TenantAdmin-editable; all other templates stay SystemAdmin-only. */
export const TENANT_EDITABLE_TEMPLATES = [
  { kind: "mail", slug: RSVP_CONFIRMATION_TYPE, access: { roles: ["TenantAdmin"] } },
] as const satisfies readonly TenantEditableTemplate[];
