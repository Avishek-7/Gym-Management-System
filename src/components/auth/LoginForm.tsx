import React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useForm, SubmitHandler } from "react-hook-form";


interface LoginFormValues {
    email: String;
    password: string;
}

export const LoginForm: React.FC = () => {
    const { login, handleSubmit, register } = useForm<LoginFormValues>();

    const onSubmit: SubmitHandler<LoginFormValues> = (data) => {
        console.log(data);
        login(data.email, data.password);
    }
}
