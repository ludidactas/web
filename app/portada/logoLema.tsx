

export default function LogoLema() {

    return (
        <div className="flex" style={{ width: '90%', alignItems: "center", alignSelf: "center" }}>

            <img className="logo " style={{ width: '40%', marginTop: '150px' }} src="/img/Logo.png" />
            <div className="flex-flow:row" style={{ width: '60%' }}>
                <img className="lema" style={{ width: 'fit-content', marginTop: '150px' }} src="/img/Lema.png" />
                <p className="text-[10px]">Tecnologías pedagógicas emergentes </p>
            </div>


        </div>
    )
}