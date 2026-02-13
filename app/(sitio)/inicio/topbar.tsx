
import LogoLema from "./logoLema";
import Menu from "./menu";

export default function Topbar(){
    return(
      <div className="flex dark:bg-[#1e1e1e] justify-between items-center p-2 px-4 mb-12">
        <LogoLema />
        <Menu />
      </div>
    )
}