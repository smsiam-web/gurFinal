import { useFormikContext } from "formik";
import { useEffect, useState } from "react";
import styles from "./FormDropdown.module.css";
import { ScrollArea, Collapse } from "@mantine/core";

function FormDropdownMango({
  itemsTrigger,
  name,
  types,
  placeholder,
  keys,
  label,
  selected,
  setSelectedCity,
  setSelectedZone,
  selectedCity,
  selectedZone,
}) {
  const { setFieldTouched, setFieldValue, errors, touched, values } =
    useFormikContext();
  const [isOpen, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(values[name]);

  const toggleDropdown = () => setOpen(!isOpen);
  const [items, setItems] = useState([]);
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);
  // const [selectedCity, setSelectedCity] = useState("");
  // const [selectedZone, setSelectedZone] = useState("");

  const handleItemClick = (id) => {
    if (selected === "setSelectedCity" && setSelectedCity) {
      setSelectedCity(id);
    } else if (selected === "setSelectedZone" && setSelectedZone) {
      setSelectedZone(id);
    }
    setFieldTouched(name);
    setSelectedItem(id);
    setFieldValue(name, id);
    toggleDropdown();
  };

  useEffect(() => {
    fetch("/api/pathao/cities")
      .then((res) => res.json())
      .then((data) => {
        console.log("City API response:", data);
        setCities(data.data || []);
      });
  }, []);

  useEffect(() => {
    if (itemsTrigger === "zones" && selectedCity) {
      fetch(`/api/pathao/zones?city_id=${selectedCity}`)
        .then((res) => res.json())
        .then((data) => setZones(data.data || []));
    }
  }, [itemsTrigger, selectedCity]);

  useEffect(() => {
    if (itemsTrigger === "areas" && selectedZone) {
      fetch(`/api/pathao/areas?zone_id=${selectedZone}`)
        .then((res) => res.json())
        .then((data) => setAreas(data.data || []));
    }
  }, [itemsTrigger, selectedZone]);

  useEffect(() => {
    if (itemsTrigger === "zones") {
      setItems(zones);
    } else if (itemsTrigger === "areas") {
      setItems(areas);
    } else if (itemsTrigger === "cities") {
      setItems(cities);
    }
  }, [itemsTrigger, isOpen]);

  console.log(selectedItem, cities, items, itemsTrigger, label, keys);

  return (
    <>
      <div className={`${styles.formDropdown} mt-2 mb-5 `}>
        <div className={`${styles.dropdown} relative`}>
          <div className={styles.dropdown_header} onClick={toggleDropdown}>
            {selectedItem
              ? items?.data.find((item) => item[keys] === selectedItem)?.[label]
              : placeholder}

            <img
              className={`${styles.icon} ${isOpen && styles.open}`}
              src="/raj_aam_wala.jpg"
              loading="lazy"
              alt=""
              width={13}
            />
          </div>
          <Collapse
            in={isOpen}
            className="absolute bg-white border z-50 w-full text-slate-500"
          >
            {Array.isArray(items?.data) && (
              <ScrollArea h={220} type="scroll" offsetScrollbars>
                <>
                  {items?.data?.map((item) => (
                    <div
                      keys={item[keys]}
                      className="justify-between py-2 pl-4 transition-colors duration-150 hover:bg-gray-100 text-gray-500 hover:text-green-500"
                      onClick={() => handleItemClick(item[keys], item[values])}
                      id={item[keys]}
                    >
                      <span
                        className={`${styles.dropdown_item_dot} ${
                          item[keys] === selectedItem && styles.selected
                        }`}
                      >
                        •{" "}
                      </span>
                      {item[`${types}_name`] ??
                        item.city_name ??
                        item.zone_name ??
                        item.area_name}
                    </div>
                  ))}
                </>
              </ScrollArea>
            )}
          </Collapse>
        </div>
      </div>
      {touched[name] && (
        <span className="text-red-400 text-sm">{errors[name]}</span>
      )}
    </>
  );
}

export default FormDropdownMango;
