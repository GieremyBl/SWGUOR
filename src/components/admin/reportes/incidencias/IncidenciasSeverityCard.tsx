'use client';

interface Props {
  resumen?: {
    baja: number;
    media: number;
    alta: number;
    critica: number;
  };
}

export default function IncidenciasSeverityCard({
  resumen,
}: Props) {

  const severity = [
    {
      label: 'Baja',
      value: resumen?.baja || 0,
      color: 'bg-green-500',
    },
    {
      label: 'Media',
      value: resumen?.media || 0,
      color: 'bg-yellow-400',
    },
    {
      label: 'Alta',
      value: resumen?.alta || 0,
      color: 'bg-orange-500',
    },
    {
      label: 'Crítica',
      value: resumen?.critica || 0,
      color: 'bg-red-500',
    },
  ];

  const total =
    severity.reduce(
      (acc, item) => acc + item.value,
      0,
    );

  return (
    <div
      className="
        bg-[#fbddd3]
        border
        border-[#e4c28a]
        rounded-3xl
        p-6
        h-[450px]
      "
    >

      <h2
        className="
          text-2xl
          font-bold
          text-[#231e1d]
          mb-6
        "
      >
        Resumen de Severidad
      </h2>

      <div className="space-y-5">

        {severity.map((item, index) => (

          <div
            key={index}
            className="
              bg-white
              rounded-2xl
              px-5
              py-4
              flex
              items-center
              justify-between
              border
              border-[#f1d7c1]
            "
          >

            <div className="flex items-center gap-3">

              <div
                className={`
                  w-4
                  h-4
                  rounded-full
                  ${item.color}
                `}
              />

              <span
                className="
                  text-[#231e1d]
                  font-semibold
                "
              >
                {item.label}
              </span>

            </div>

            <span
              className="
                text-xl
                font-black
                text-[#231e1d]
              "
            >
              {item.value}
            </span>

          </div>

        ))}

      </div>

      <div className="mt-8">

        <div className="
          flex
          items-center
          justify-between
          mb-2
        ">

          <p className="text-[#6b5b52] font-medium">
            Riesgo General
          </p>

          <p className="
            text-[#b5854b]
            font-bold
          ">
            {total}
          </p>

        </div>

      </div>

    </div>
  );
}