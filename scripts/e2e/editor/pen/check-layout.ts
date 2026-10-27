import { runPenBrowserSuite } from "./browser-suite";
import { layoutFlow } from "./layout-flow";

await runPenBrowserSuite("layout", "PEN_LAYOUT_PASSED", layoutFlow);
