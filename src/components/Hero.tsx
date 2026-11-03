import React from "react";

export default function Hero() {
  return (
    <section className="pt-16 pb-12 sm:pt-20 sm:pb-16 md:pt-24 md:pb-16 text-center px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[66px] font-black tracking-[-0.035em] leading-[1.08] text-neutral-950">
          Build, run and grade quizzes with a built-in coding workspace.
        </h1>

        <p className="mt-6 text-base sm:text-lg md:text-[19px] leading-relaxed text-neutral-500 max-w-2xl mx-auto font-normal">
          Provision governed, self-hosted environments for your developers and
          the coding agents you approve, secured on your enterprise
          infrastructure.
        </p>
      </div>
    </section>
  );
}
