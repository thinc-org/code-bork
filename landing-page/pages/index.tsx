import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';

const Home: NextPage = () => {
  return (
    <div className="bg-[#E0BA84] flex min-h-screen flex-col">
      <Head>
        <title>Code::Bork</title>
        <link rel="icon" type="image/png" href="./logo.png" />
        <link rel="apple-touch-icon" type="image/png" href="/logo.png" />
        <link
          rel="apple-touch-icon"
          type="image/png"
          sizes="72x72"
          href="/logo.png"
        />
        <link
          rel="apple-touch-icon"
          type="image/png"
          sizes="114x114"
          href="/logo.png"
        />
      </Head>

      <div className="max-w-2xl m-auto text-center w-full">
        <div className="text-3xl text-white font-bold">Code::Bork 🐶</div>
        <div className="text-white">Simple C++ IDE for macOS</div>
        <div className="flex gap-4 mt-5 font-bold justify-center">
          <a
            href="https://drive.google.com/file/d/18LP8JrRt-FIQuYAFVSlsXjsgmS7IbEYd/view?usp=sharing"
            className="bg-white hover:bg-slate-100 cursor-pointer p-3 text-sm rounded-lg"
          >
            Download for Mac Apple Silicon
          </a>
          <a
            href="https://drive.google.com/file/d/1j9tYTS6g2LsWMJIXPxQQJ76rvsBn8HIb/view?usp=sharing"
            className="bg-white hover:bg-slate-100 cursor-pointer p-3 text-sm rounded-lg"
          >
            Download for Mac Intel
          </a>
        </div>
        <div className="w-full relative aspect-[96/71]">
          <Image src="/screenshot.png" alt="Code::Bork" layout="fill" />
        </div>
      </div>
    </div>
  );
};

export default Home;
