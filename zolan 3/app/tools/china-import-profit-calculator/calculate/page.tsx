import {cookies} from "next/headers";import {redirect} from "next/navigation";import {hasAccess,COOKIE} from "../../../../lib/access";import Calculator from "../../../calculator";
export const dynamic="force-dynamic";
export default async function Page(){if(!await hasAccess((await cookies()).get(COOKIE)?.value))redirect("/tools/china-import-profit-calculator");return <Calculator/>}