import * as zod from "zod";

export const Signupschema = zod.object({
  name: zod
    .string()
    .nonempty("Name is required")
    .min(3, "Name must be at least 3 characters")
    .max(20, "Name must be at most 20 characters")
    ,
  username: zod
    .string()
    .nonempty("Username is required")
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    ,
  email: zod
    .string()
    .nonempty("Email is required")
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Email is invalid",
    )
    ,
  dateOfBirth: zod
    .string()
    .nonempty("Date of birth is required")
    .refine((dateOfBirth) => {
      const userDate = new Date(dateOfBirth).getFullYear();
      const today = new Date().getFullYear();
      return userDate > today - 13 ? false : true;
    }, "You must be at least 13 years old"),
  gender: zod.enum(["male", "female"]),
  password: zod
    .string()
    .nonempty("Password is required")
    .regex(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
      "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character",
    ),
  rePassword: zod.string().nonempty("Password is required"),
}).refine((data)=>{
  return data.password === data.rePassword;
},{
  error:"Passwords do not match",
  path:["rePassword"],
});

export type Signupschematype = zod.infer<typeof Signupschema>

///////////////////////////////////////////////////////////


export const Loginschema = zod.object({
  
  email: zod
    .string()
    .nonempty("Email is required")
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Email is invalid",
    )
    ,
  
  password: zod
    .string()
    .nonempty("Password is required")
    .regex(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
      "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character",
    ),
});

export type Loginschematype = zod.infer<typeof Loginschema>