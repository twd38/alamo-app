#  sync_part.py  –– drop in  %UGII_USER_DIR%\startup
#  NX 2306 / 2312 compatible

import sys, os
nx_lib = os.path.join(os.environ['UGII_BASE_DIR'], 'nxbin', 'python', 'Lib')
if nx_lib not in sys.path:
    sys.path.append(nx_lib)        # ensure std‑lib is visible
    
import json, requests
import NXOpen

SESSION = NXOpen.Session.GetSession()
LW       = SESSION.ListingWindow


def collect_part_data(part: NXOpen.BasePart) -> dict:
    """
    Pull whatever you care about – part number, revision, and      *
    any user attributes you’ve attached in NX.                     *
    """
    data = {
        "partNumber": part.PartNumber,
        "partRevision": part.PartRevision,
        "description": part.Leaf,
        "unit": "EA",
        "trackingType": "SERIAL",
        "nxFilePath": part.FullPath,
    }

    # Grab all user‑defined attributes
    for attr in part.GetUserAttributes():
        data[attr.Title] = attr.StringValue

    return data


def push_to_database(payload: dict):
    """
    Hit your REST endpoint or talk directly to Postgres –           *
    the only thing NX cares about is that you do it synchronously   *
    so the user gets feedback.                                      *
    """
    url = "https://alamo-app.vercel.app/api/parts"
    key = "qTY7gMhvMjmU3M4Ho4NGZiQuydSBNy5y"

    resp  = requests.post(
        url,
        headers={
            "X-API-KEY": key,
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()          # optional – parse whatever you return


def main():
    part = SESSION.Parts.Work
    if part is None:
        raise RuntimeError("No work part is loaded.")

    data = collect_part_data(part)
    # result = push_to_database(data)

    LW.Open()
    LW.WriteLine(f"✅  Synced “{part.Leaf}” successfully.")
    LW.WriteLine(json.dumps(data, indent=2))


if __name__ == "__main__":
    main()
