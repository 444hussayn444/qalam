import * as chai from "chai";
import chaiHttp, { request } from "chai-http";
import app from "../index.js"; // Import your express app
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const { expect } = chai;
chai.use(chaiHttp.default || chaiHttp);

describe("Admin API", () => {
  let adminToken;

  before((done) => {
    request
      .execute(app)
      .post("/api/v1/admin/login")
      .send({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.success).to.be.true;
        adminToken = res.body.token;
        done();
      });
  });

  describe("GET /api/v1/admin/categories", () => {
    it("should get all categories with a valid token", (done) => {
      request
        .execute(app)
        .get("/api/v1/admin/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.be.an("array");
          done();
        });
    });

    it("should return 401 without a token", (done) => {
      request
        .execute(app)
        .get("/api/v1/admin/categories")
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });
  });

  describe("GET /api/v1/products", () => {
    it("should get all products without a token", (done) => {
      request
        .execute(app)
        .get("/api/v1/products")
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.be.an("array");
          done();
        });
    });
  });
});
