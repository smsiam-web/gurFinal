import { useFormikContext } from 'formik'
import { useEffect, useState } from 'react'

function FormRadio({placeholder, name, onChange, forTrue, forFalse}) {
    const {setFieldValue, values} = useFormikContext()
    const [checked, setChecked] = useState(values[name])

    const handleChange = e => {
        setChecked(!checked)
        setFieldValue(name, !checked)
    }

    useEffect(() => {
        if(!onChange) return
        onChange(values[name])
    }, [values[name]])

    return (
        <div className="formRadio mt-2">
            <h4 className="text-gray-600 mr-3 font-medium">{placeholder}</h4>
            <div className="toggle-radio">
                <input type="radio" className='hidden' name="rdo" id={forTrue} checked={checked} onChange={handleChange} />
                <input type="radio" className='hidden' name="rdo" id={forFalse} checked={!checked} onChange={handleChange} />
                <div className="switch grid gap-4 grid-cols-2 w-fit">
                    <label className={`${checked ? "bg-blue-400 text-white" : "bg-gray-200"} col-span-1 cursor-pointer  px-6 py-2 rounded-lg text-md font-semibold`} htmlFor={forTrue}>{forTrue}</label>
                    <label className={`${!checked ? "bg-blue-400 text-white" : "bg-gray-200"} col-span-1 cursor-pointer  px-6 py-2 rounded-lg text-md font-semibold`} htmlFor={forFalse}>{forFalse}</label>
                
                </div>
            </div>
        </div>
    )
}

export default FormRadio
