import {
  type ConfigResolver,
  createConfigAccessorFactory,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { createTemplateResolverApi } from "@cosmicdrift/kumiko-bundled-features/template-resolver";
import type { DbConnection } from "@cosmicdrift/kumiko-framework/db";
import type { Registry } from "@cosmicdrift/kumiko-framework/engine";
import type { SearchAdapter } from "@cosmicdrift/kumiko-framework/search";

export function buildShowPonyExtraContext(options: {
  readonly configResolver: ConfigResolver;
  readonly searchAdapter: SearchAdapter;
}): (deps: { readonly db: DbConnection; readonly registry: Registry }) => Record<string, unknown> {
  return ({ registry, db }) => ({
    configResolver: options.configResolver,
    configAccessorFactory: createConfigAccessorFactory(registry, options.configResolver),
    templateResolver: createTemplateResolverApi(db, registry),
    searchAdapter: options.searchAdapter,
  });
}
