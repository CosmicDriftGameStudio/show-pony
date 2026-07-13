import { BRANDING_QN } from "@cosmicdrift/kumiko-bundled-features/managed-pages";
import {
  type ConfigEditScreenDefinition,
  createSelectField,
  createTextField,
} from "@cosmicdrift/kumiko-framework/engine";
import { HERO_STYLES, INVITE_BRANDING_QN } from "../invite-branding";

const ADMIN_ROLES = ["TenantAdmin", "Admin", "SystemAdmin"] as const;

export const inviteBrandingScreen: ConfigEditScreenDefinition = {
  id: "invite-branding-settings",
  type: "configEdit",
  scope: "tenant",
  configKeys: {
    title: BRANDING_QN.title,
    description: BRANDING_QN.description,
    accentColor: BRANDING_QN.accentColor,
    logoUrl: BRANDING_QN.logoUrl,
    heroImageUrl: INVITE_BRANDING_QN.heroImageUrl,
    heroStyle: INVITE_BRANDING_QN.heroStyle,
  },
  fields: {
    title: createTextField({ maxLength: 200 }),
    description: createTextField({ maxLength: 500, multiline: { rows: 3 } }),
    accentColor: createTextField({ maxLength: 9 }),
    logoUrl: createTextField({ maxLength: 2000, format: "url" }),
    heroImageUrl: createTextField({ maxLength: 2000 }),
    heroStyle: createSelectField({ options: HERO_STYLES }),
  },
  layout: {
    sections: [
      {
        title: "showpony:branding.section.identity",
        columns: 2,
        fields: [
          { field: "title", span: 1 },
          { field: "accentColor", span: 1 },
          { field: "description", span: 2 },
          { field: "logoUrl", span: 2 },
        ],
      },
      {
        title: "showpony:branding.section.hero",
        columns: 2,
        fields: [
          { field: "heroStyle", span: 1 },
          { field: "heroImageUrl", span: 1 },
        ],
      },
    ],
  },
  access: { roles: ADMIN_ROLES },
};
