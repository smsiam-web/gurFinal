import React from "react";
import { Table } from "@mantine/core";

const AdditionalInfo = ({ product = null }) => {
  return (
    <div className="sm:px-4 py-6">
      <Table captionSide="bottom" highlightOnHover withBorder withColumnBorders>
        <tbody>
          <tr key={"aaaa"}>
            <td>ওজন</td>
            <td>১ কেজি</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
};

export default AdditionalInfo;
