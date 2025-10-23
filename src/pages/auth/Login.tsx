import { AuthPage } from "@refinedev/antd";

export const Login: React.FC = () => {
  return (
    <AuthPage
      type="login"
      title={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          🏪 GLT Admin
        </span>
      }
      formProps={{
        initialValues: {
          email: "",
          password: "",
        },
      }}
    />
  );
};
