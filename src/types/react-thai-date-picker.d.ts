declare module "react-thai-date-picker" {
  import { FC } from "react";

  interface ThaiDatePickerProps {
    value?: Date;
    onChange?: (date: Date) => void;
    [key: string]: any;
  }

  const ThaiDatePicker: FC<ThaiDatePickerProps>;
  export default ThaiDatePicker;
}
