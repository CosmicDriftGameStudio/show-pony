import type {
  EntityEditScreenDefinition,
  EntityListScreenDefinition,
} from "@cosmicdrift/kumiko-framework/ui-types";

export const eventListScreen: EntityListScreenDefinition = {
  id: "event-list",
  type: "entityList",
  entity: "event",
  columns: ["title", "slug", "startsAt", "location", "guestLimit"],
  pageSize: 25,
  defaultSort: { field: "title", dir: "asc" },
  rowActions: [{ kind: "navigate", id: "edit", label: "kumiko.actions.edit", screen: "event-edit" }],
};

export const eventEditScreen: EntityEditScreenDefinition = {
  id: "event-edit",
  type: "entityEdit",
  entity: "event",
  layout: {
    sections: [
      {
        title: "showpony:section.event-basics",
        columns: 2,
        fields: [{ field: "title", span: 2 }, "slug", "startsAt", "location", "guestLimit"],
      },
      { title: "showpony:section.event-details", columns: 1, fields: ["description"] },
    ],
  },
};

export const rsvpListScreen: EntityListScreenDefinition = {
  id: "rsvp-list",
  type: "entityList",
  entity: "rsvp",
  columns: ["name", "status", "plusN", "email"],
  pageSize: 50,
  defaultSort: { field: "name", dir: "asc" },
};

