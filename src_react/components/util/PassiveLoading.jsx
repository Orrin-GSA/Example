import React from "react";
import BounceLoader from "react-spinners/BounceLoader";

function PassiveLoading() {
  return (
    <div>
        <BounceLoader
            color={"#707070"}
            loading={true}
            size={20}
            aria-label="Loading Spinner"
            data-testid="loader"
            loader="BounceLoader"
        />
    </div>
  )
}

export default PassiveLoading;