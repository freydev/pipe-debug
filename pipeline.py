import os
from sqlalchemy import JSON, Column, Integer, String

import pandas as pd

from datapipe.core_steps import BatchTransform
from datapipe.compute import DataStore, Catalog, Table, Pipeline, build_compute
from datapipe.store.database import TableStoreDB, DBConn

DB_CONN_URI = os.environ.get('DB_CONN_URI', "sqlite:///store.sqlite")

# dbconn = DBConn("sqlite:///store.sqlite")
# dbconn = DBConn("sqlite:///:memory:")
# dbconn = DBConn("postgresql://postgres:postgres@localhost:5432/postgres")
dbconn = DBConn(DB_CONN_URI)

catalog = Catalog({
    "events": Table(
        store=TableStoreDB(
            name="events",
            dbconn=dbconn,
            data_sql_schema=[
                Column("user_id", Integer(), primary_key=True),
                Column("event_id", Integer(), primary_key=True),
                Column("event", JSON()),
            ]
        )
    ),
    "user_profiles": Table(
        store=TableStoreDB(
            name="user_profiles",
            dbconn=dbconn,
            data_sql_schema=[
                Column("user_id", Integer(), primary_key=True),
                Column("lang", String()),
                Column("offer_clicks", JSON()),
            ]
        )
    ),
    "user_lang": Table(
        store=TableStoreDB(
            name="user_lang",
            dbconn=dbconn,
            data_sql_schema=[
                Column("user_id", Integer(), primary_key=True),
                Column("lang", String()),
            ]
        )
    ),
})

def agg_profile(df: pd.DataFrame) -> pd.DataFrame:
    res = []

    res_lang = []

    for user_id, grp in df.groupby("user_id"):
        res.append({
            "user_id": user_id,
            "lang": grp.iloc[-1]["event"]["lang"],
            "offer_clicks": [x["offer_id"] for x in grp["event"] if x["event_type"] == "click"]
        })

        res_lang.append({
            "user_id": user_id,
            "lang": grp.iloc[-1]["event"]["lang"],
        })

    return (
        pd.DataFrame.from_records(res),
        pd.DataFrame.from_records(res_lang),
    )

pipeline = Pipeline(steps=[
    BatchTransform(
        agg_profile,
        inputs=["events"],
        outputs=["user_profiles", "user_lang"],
    )
])

ds = DataStore(dbconn)

steps = build_compute(ds, catalog, pipeline)
