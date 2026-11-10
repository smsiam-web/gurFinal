import { updateAddId } from "@/app/redux/slices/filterId";
import { useFormikContext, getIn } from "formik";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import styles from "./FormDropdownOpt.module.css";
import { ScrollArea, Collapse } from "@mantine/core";
import Image from "next/image";



function FormDropdownOpt({
  items = [],
  name,
  placeholder,
  keyField = "id",
  valueField = "id",
  labelField = "name",
  onSelect,
}) {
  const { setFieldTouched, setFieldValue, errors, touched, values } =
    useFormikContext();

  const dispatch = useDispatch();
  const currentValue = getIn(values, name);

  const [isOpen, setOpen] = useState(false);
  const [selected, setSelected] = useState(currentValue);

  useEffect(() => {
    setSelected(currentValue);
  }, [currentValue]);

  const normalized = useMemo(() => {
    // Support primitives or objects
    return (Array.isArray(items) ? items : []).map((it, index) => {
        if (it && typeof it === "object") {
          console.log(it, index);
        return {
          _key: it.value,
          _value: it.value,
          _label: it.value ?? String(it.value ?? ""),
          _raw: it.value,
        };
      }
      return { _key: String(it), _value: it, _label: String(it), _raw: it };
    });
  }, [items, keyField, valueField, labelField]);

  const selectedLabel = useMemo(() => {
    const found = normalized.find((x) => x._value === selected);
    return found ? found._label : "";
  }, [normalized, selected]);

  console.log(normalized);

  const toggleDropdown = () => setOpen((s) => !s);



  const error = getIn(errors, name);
  const isTouched = getIn(touched, name);

  return (
    <>
      <div className={`${styles.formDropdown} mt-2 mb-5`}>
        <div className={`${styles.dropdown} relative`}>
          <div className={styles.dropdown_header} onClick={toggleDropdown}>
            {selected ? selectedLabel : placeholder}
            <Image
              className={`${styles.icon} ${isOpen ? styles.open : ""}`}
              src="/login-dark.png" // must be in /public
              alt="" // decorative
              aria-hidden="true"
              width={13}
              height={13}
            />
          </div>

          <Collapse
            in={isOpen}
            className="absolute bg-white border z-50 w-full text-slate-500"
          >
            {normalized.length > 0 && (
              <ScrollArea h={220} type="scroll" offsetScrollbars>
                <div>
                  {normalized.map((it) => (
                    <div
                      key={it._key}
                      className="justify-between py-2 pl-4 transition-colors duration-150 hover:bg-gray-100 text-gray-500 hover:text-green-500 cursor-pointer"
                      
                      id={String(it._key)}
                    >
                      <span
                        className={`${styles.dropdown_item_dot} ${
                          it._label === selected && styles.selected
                        }`}
                      >
                        •{" "}
                      </span>
                      {it._label}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </Collapse>
        </div>
      </div>

      {isTouched && error && (<>
        <span className="text-red-400 text-sm">{String(error)}</span>
        {console.log(error)};</>
      )}
    </>
  );
}

export default FormDropdownOpt;
