import { MilvusClient } from "../milvus";

import { GENERATE_NAME, IP } from "../const";
import { DataType } from "../milvus/types/Common";
import { ErrorCode } from "../milvus/types/Response";
import { InsertReq } from "../milvus/types/Insert";
import { generateInsertData } from "../utils";
import { genCollectionParams, VECTOR_FIELD_NAME } from "../utils/test";

let milvusClient = new MilvusClient(IP);
const COLLECTION_NAME = GENERATE_NAME();

describe("Data.ts Test", () => {
  beforeAll(async () => {
    await milvusClient.collectionManager.createCollection(
      genCollectionParams(COLLECTION_NAME, "4", DataType.FloatVector, false)
    );

    const fields = [
      {
        isVector: true,
        dim: 4,
        name: VECTOR_FIELD_NAME,
      },
      {
        isVector: false,
        name: "age",
      },
    ];
    const vectorsData = generateInsertData(fields, 10);

    const params: InsertReq = {
      collection_name: COLLECTION_NAME,
      fields_data: vectorsData,
    };

    await milvusClient.dataManager.insert(params);
    const res = await milvusClient.collectionManager.loadCollectionSync({
      collection_name: COLLECTION_NAME,
    });
  });

  afterAll(async () => {
    await milvusClient.collectionManager.dropCollection({
      collection_name: COLLECTION_NAME,
    });
  });

  it("Flush Sync", async () => {
    const res = await milvusClient.dataManager.flushSync({
      collection_names: [COLLECTION_NAME],
    });
    expect(res.status.error_code).toEqual(ErrorCode.SUCCESS);
  });

  it("Flush ASync", async () => {
    const res = await milvusClient.dataManager.flush({
      collection_names: [COLLECTION_NAME],
    });
    expect(res.status.error_code).toEqual(ErrorCode.SUCCESS);
  });

  it("Expr Search", async () => {
    const res = await milvusClient.dataManager.search({
      collection_name: COLLECTION_NAME,
      // partition_names: [],
      expr: "",
      vectors: [[1, 2, 3, 4]],
      search_params: {
        anns_field: VECTOR_FIELD_NAME,
        topk: "4",
        metric_type: "L2",
        params: JSON.stringify({ nprobe: 1024 }),
        round_decimal: -1,
      },
      output_fields: ["age"],
      vector_type: DataType.FloatVector,
    });

    expect(res.status.error_code).toEqual(ErrorCode.SUCCESS);
  });

  it("Query ", async () => {
    const res = await milvusClient.dataManager.query({
      collection_name: COLLECTION_NAME,
      expr: "age in [2,4,6,8]",
      output_fields: ["age", VECTOR_FIELD_NAME],
    });
    console.log(res);
    expect(res.status.error_code).toEqual(ErrorCode.SUCCESS);
  });
});
