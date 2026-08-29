import { createLowlight, common } from "lowlight";

/**
 * `common` covers the 37 languages worth highlighting (js/ts/py/go/rust/sql/
 * bash/json/yaml...). The full set is 192 and five times the bundle for
 * languages this notebook will never see.
 *
 * Lives in its own module because both the extension config and the code-block
 * node view need it, and importing it from either would make a cycle.
 */
export const lowlight = createLowlight(common);
