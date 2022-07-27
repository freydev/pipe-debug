from typing import List, Dict, Optional

from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd

from datapipe.types import ChangeList
from datapipe.compute import run_steps_changelist

from pipeline import steps, catalog, ds


app = FastAPI()


class PipelineStepResponse(BaseModel):
    type: str
    name: str
    inputs: List[str]
    outputs: List[str]


class GraphResponse(BaseModel):
    catalog: Dict
    pipeline: List[PipelineStepResponse]


class UpdateDataRequest(BaseModel):
    table_name: str
    upsert: Optional[List[Dict]] = None
    # delete: List[Dict] = None


@app.get("/graph", response_model=GraphResponse)
def get_graph() -> GraphResponse:
    return GraphResponse(
        catalog={
            table_name: {}
            for table_name in catalog.catalog.keys()
        },
        pipeline=[
            PipelineStepResponse(
                type="transform",
                name=step.get_name(),
                inputs=[i.name for i in step.get_input_dts()],
                outputs=[i.name for i in step.get_output_dts()],
            )
            for step in steps
        ]
    )


@app.post("/update-data")
def update_data(req: UpdateDataRequest):
    dt = catalog.get_datatable(ds, req.table_name)

    cl = ChangeList()

    if req.upsert is not None and len(req.upsert) > 0:
        idx = dt.store_chunk(
            pd.DataFrame.from_records(req.upsert)
        )

        cl.append(dt.name, idx)

    # if req.delete is not None and len(req.delete) > 0:
    #     idx = dt.delete_by_idx(
    #         pd.DataFrame.from_records(req.delete)
    #     )

    #     cl.append(dt.name, idx)

    run_steps_changelist(ds, steps, cl)

    return {
        "result": "ok"
    }


class GetDataRequest(BaseModel):
    table_name: str
    idx: List[Dict]


@app.post("/get-data")
def get_data(req: GetDataRequest):
    dt = catalog.get_datatable(ds, req.table_name)

    res = dt.get_data(idx = pd.DataFrame.from_records(req.idx))

    return res.to_dict(orient="records")
