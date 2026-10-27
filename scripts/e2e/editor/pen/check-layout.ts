import { runPenBrowserSuite } from "./browser-suite";
import { layoutFlow } from "./layout-flow";
import { constraintIntegration } from "./constraint-integration";

await runPenBrowserSuite("layout", "PEN_LAYOUT_PASSED", async (suite) => {
  await layoutFlow(suite);
  await constraintIntegration(suite);
});
