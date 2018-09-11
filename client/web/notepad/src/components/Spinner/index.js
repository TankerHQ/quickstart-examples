// Copied from: http://tobiasahlin.com/spinkit/
import * as React from "react";
import "./Spinner.css";

const Spinner = (props) => {
  const { className, ...otherProps } = props;
  const combinedClassName = `spinner${className ? ` ${className}` : ''}`;

  return (
    <div className={combinedClassName} {...otherProps}>
      <div className="rect1" />
      <div className="rect2" />
      <div className="rect3" />
      <div className="rect4" />
      <div className="rect5" />
    </div>
  );
};

export default Spinner;
