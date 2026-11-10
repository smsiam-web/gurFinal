import { useFormikContext } from "formik";
import Button from "../../Button";

function FormBtn({ title, loading = false }) {
  const { handleSubmit } = useFormikContext();

  return (
    <Button
      className="w-full py-3 text-white capitalize bg-[#0f172a]  hover:bg-[#17233f] "
      title={title}
      loading={loading}
      onClick={handleSubmit}
      type="button"
    />
  );
}

export default FormBtn;
