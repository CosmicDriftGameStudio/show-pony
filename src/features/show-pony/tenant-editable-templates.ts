import type { TenantEditableTemplate } from "@cosmicdrift/kumiko-bundled-features/template-resolver";
import { access } from "@cosmicdrift/kumiko-framework/engine";
import { RSVP_CONFIRMATION_TYPE } from "./lib/rsvp-confirmation-mail";

/** Only the guest-facing RSVP mail is host-editable (access.admin); all other templates stay SystemAdmin-only. */
export const TENANT_EDITABLE_TEMPLATES = [
  { kind: "mail", slug: RSVP_CONFIRMATION_TYPE, access: { roles: access.admin } },
] as const satisfies readonly TenantEditableTemplate[];
