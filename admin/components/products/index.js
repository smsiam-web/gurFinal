import React, { useEffect, useState } from "react";
import SearchBy from "./SearchBy";
import DropDownload from "./DropDownload";
import ProductTable from "./ProductTable";
import AddProduts from "./add_products";
import { Drawer } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";
import {
  selectUpdateProductId,
  updateProductId,
} from "@/app/redux/slices/updateProductId";

const Products = () => {
  const [opened, setOpend] = useState(false);
  const dispatch = useDispatch();

  // get product ID from redux
  const ProductID = useSelector(selectUpdateProductId);
  const ID = ProductID?.id;

  // close drawer and clean productID
  const cleanId = () => {
    setOpend(false), ID && dispatch(updateProductId(null));
  };

  // toggle drawer
  const toggleOpen = () => {
    opened ? cleanId() : setOpend(true);
  };

  useEffect(() => {
    ID && toggleOpen();
  }, [ID]);

  return (
    <main className="h-full overflow-y-auto">
      <div className="">
        <Drawer
          opened={opened}
          onClose={() => toggleOpen()}
          zIndex={9999999}
          withCloseButton={false}
          position="right"
          size="xl"
          padding={0}
        >
          <div className="">
            <AddProduts onClick={() => toggleOpen()} />
          </div>
        </Drawer>
      </div>
      <div className="grid mx-auto">
        <h1 className="mb-3 text-lg font-bold text-gray-700 ">Products</h1>
        <SearchBy onClick={() => toggleOpen()} />
        <DropDownload />
        <ProductTable />
      </div>
    </main>
  );
};

export default Products;
