import Link from "next/link";
import { GetServerSideProps } from "next";
import IoLayout from "../../../components/io/IoLayout";
import { appHref } from "../../../lib/io/appLinks";

type Props = {
  slug: string;
};

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function IoCaseStudyDetailPage({ slug }: Props) {
  const title = titleFromSlug(slug);

  return (
    <IoLayout
      title={`Veveve — Case Study | ${title}`}
      description="Discover how agentic PPC systems help teams scale internationally with measurable results."
    >
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-teal-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Link href="/case-studies" className="text-blue-600 font-semibold hover:underline">
              ← Back to case studies
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-4">{title}</h1>
            <p className="text-xl text-gray-600">
              Discover how agentic PPC systems help teams scale internationally with measurable results.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Full case study coming soon</h2>
            <p className="text-gray-700 mb-6">
              We're finalizing the details of this case study with verified metrics and client approval.
              In the meantime, explore our other case studies or start a trial to see the platform in action.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/case-studies" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold">
                View all case studies
              </Link>
              <a href={appHref("/register")} className="bg-white text-blue-600 border-2 border-blue-600 px-6 py-3 rounded-lg font-semibold">
                Start Free Trial
              </a>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-2">Want similar results?</h2>
            <p className="text-blue-100 mb-6">
              Start a trial or explore pricing to see which plan fits your team’s governance needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={appHref("/register")} className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold">
                Start Free Trial
              </a>
              <Link href="/pricing" className="border-2 border-white px-6 py-3 rounded-lg font-semibold">
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </IoLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const slugParam = context.params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  if (!slug) {
    return { notFound: true };
  }

  return { props: { slug } };
};

