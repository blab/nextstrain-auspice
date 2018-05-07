import React from "react";
import { controlsPadding } from "../../util/globals";
import { sidebarColor, darkGrey } from "../../globalStyles";

const ToggleSidebarTab = ({open, handler, widthWhenOpen, widthWhenShut, dontDisplay}) => {

  if (dontDisplay) return null;

  const style = {
    width: 13,
    height: 34,
    position: "fixed",
    top: 0,
    zIndex: 1001,
    color: darkGrey,
    backgroundColor: open ? "inherit" : sidebarColor,
    boxShadow: open ? "none" : "-2px -2px 4px -2px rgba(0, 0, 0, 0.15) inset", // from react-sidebar
    cursor: "pointer",
    paddingTop: 17,
    fontSize: 14,
    paddingLeft: open ? 1 : 4,
    transition: "left .3s ease-out",
    left: open ? widthWhenOpen + controlsPadding - 19 : widthWhenShut
  };


  //
  // if (side === "left") {
  //
  //   style.left = open ? controlsWidth + controlsPadding - 19 : 0;
  // } else {
  //   style.paddingRight = open ? 1 : 4;
  //   style.transition = "right .3s ease-out";
  //   style.right = open ? 300 + controlsPadding - 19 : 0;
  // }
  return (
    <div
      onClick={handler}
      style={style}
    >
      {open ?
        <i className={"fa fa-chevron-left"} aria-hidden="true"/> :
        <i className={"fa fa-chevron-right"} aria-hidden="true"/>
      }
    </div>
  );
};

export default ToggleSidebarTab;