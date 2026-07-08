"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Waiter = {
  photo?: string;
  fullName?: string;
  rating?: number;
  phoneNumber?: string;
  company?: {
    logo?: string;
    name?: string;
  };

};

export default function HomePage() {
  const router = useRouter();
  const [waiters, setWaiters] = useState<Waiter[]>([]);

  const companyId = "50301";

  const waiterPhones = [
    "0988873030",
    "0903648687",
    "0900184697",
    "0926619046",
    "0900476240",
    "0934592123",
    "0983108118",
    "0912321618",
    "0935344867",
    "0922100259",
    "0945438849",
    "0965473846",
    "0985344309",
    "0977601956",
    "0923815148",
    "0927732041",
    "0951516453",
    "0978628505",
    "0953844075",
    "0939825010",
    "0949915373",
    "0946714543",
    "0925426708"

  ];

  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchWaiters = async () => {
      try {
        const results = await Promise.all(
          waiterPhones.map(async (phone) => {
            const res = await fetch(
              `https://v7-hulubeje.cnetcommerce.com/api/waiter/get?phoneNumber=${phone}&companyId=${companyId}`,
              {
                headers: {
                  "x-api-key": "5D5EAFF4-D29A-485B-BDB9-785EF86FFFAE",
                  Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwOTM5OTc3ODg2IiwianRpIjoiQzMyMEUwNTM0NDdFNjVGMDZBNkJEMzk2NzBCMEI1MDYwMDE0NTg1MDQwODVENjQxRkI4NTQ5ODhDNDU1NjREMjUxOTVGN0EyMEQ0OTJENDc5RjA3NEYxNUVDREI2NjlDNzgzQTczQjE1ODlBNTY0QjQ4OEY3NjMyNjA0RjRDMkEiLCJleHAiOjE3ODQyNzM4NzAsImlzcyI6Ikh1bHViZWplIiwiYXVkIjoiSHVsdWJlamUifQ.TAON94Z1F6dpO-t3wm0gTfrjwUD5M0Ae3inlQhWSTlk"
                  ,
                },
              }
            );

            //  const result = await res.json();
            //add in
            const text = await res.text();

            console.log(phone, res.status, text);

            if (!text) {
              console.error("Empty response for:", phone);
              return null;
            }

            const result = JSON.parse(text);
            //end

            if (result.isSuccessful) {
              return result.data;
            }

            return null;
          })
        );


        // remove failed ones
        const validWaiters = results
          .filter(Boolean)
          .sort((a: any, b: any) =>
            (a.fullName || "").localeCompare(b.fullName || "")
          );
        setWaiters(validWaiters);
        // setWaiters(results.filter(Boolean));
      } catch (err) {
        console.error(err);
      }
    };

    fetchWaiters();
  }, []);

  return (
    <main className="flex justify-center items-start min-h-screen bg-gray-100 py-10">
      <div className="bg-white w-[350px] rounded-xl shadow-lg p-6 text-center space-y-6 relative">

        {/* Card with logo half in/out */}
        <div className="bg-white border-1 border-yellow-300 rounded-xl shadow-lg pt-14 pb-6 px-4 relative text-center">

          {/* Logo half inside/outside */}
          <img

            src="goFresh.jpg"
            className="w-20 h-20 rounded-full absolute -top-10 left-1/2 transform -translate-x-1/2 border-2 border-yellow-300"
          />
          <h1 className="text-xl font-bold text-black text-center mb-6">
            Our Waiters
          </h1>
          <input
            type="text"
            placeholder="Search waiter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 border rounded-lg mb-4 text-black"
          />


          <div className="space-y-4">
            {/* {waiters.map((w) => ( */}
            {waiters
              .filter((w: any) =>
                (w.fullName || "")
                  .toLowerCase()
                  .includes(search.toLowerCase())
              )
              .sort((a: any, b: any) =>
                (a.fullName || "").localeCompare(b.fullName || "")
              )
              .map((w) => (
                <div
                  key={w.phoneNumber}
                  onClick={() => {
                    const data = btoa(JSON.stringify({ phone: w.phoneNumber, companyId }));
                    router.push(`/tip?data=${data}`);
                  }}
                  className="bg-white rounded-xl shadow p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg"
                >
                  <img
                    src={w.photo || "/waiter.png"}
                    className="w-14 h-14 rounded-full object-cover"
                  />

                  <div className="flex-1 text-left">
                    <h2 className="text-black font-semibold">
                      {w.fullName}
                    </h2>

                    <p className="text-sm text-gray-500">
                      ⭐ {w.rating || 0}
                    </p>
                  </div>

                  <div className="text-gray-400 text-xl">→</div>
                </div>
              ))}
          </div></div></div>
    </main>
  );
}