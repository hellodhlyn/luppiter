import chai from "chai";
import chaiHttp from "chai-http";

import app from "../../src/app";

chai.use(chaiHttp);
chai.should();

export default chai.request(app).keepOpen();
