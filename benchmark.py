import pandas as pd

from datapipe.compute import run_steps_changelist
from datapipe.types import ChangeList

from pipeline import ds, steps, catalog

dt = catalog.get_datatable(ds, "events")

cl = ChangeList()

idx = dt.store_chunk(
    pd.DataFrame.from_records([
        {
            "user_id": 5,
            "event_id": 3,
            "event": {
                "event_type": "click",
                "lang": "ru",
                "offer_id": 1
            }
        },
        {
            "user_id": 6,
            "event_id": 4,
            "event": {
                "event_type": "click",
                "lang": "ru",
                "offer_id": 2
            }
        }
    ])
)

cl.append(dt.name, idx)

# if req.delete is not None and len(req.delete) > 0:
#     idx = dt.delete_by_idx(
#         pd.DataFrame.from_records(req.delete)
#     )

#     cl.append(dt.name, idx)

run_steps_changelist(ds, steps, cl)
