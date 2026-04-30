'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PublicLayout from '@/components/public/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPlus,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Loader2,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';

interface Department {
  id: string;
  name: string;
  courses: {
    id: string;
    name: string;
    duration: string | null;
    totalFee: number;
    description: string | null;
  }[];
}

function formatCurrency(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId') || '';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredName, setRegisteredName] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [courseId, setCourseId] = useState(preselectedCourseId);

  useEffect(() => {
    fetch('/api/public/courses')
      .then((r) => r.json())
      .then((data) => {
        setDepartments(data.departments || []);
        if (preselectedCourseId) {
          setCourseId(preselectedCourseId);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [preselectedCourseId]);

  const allCourses = departments.flatMap((d) =>
    d.courses.map((c) => ({ ...c, departmentName: d.name }))
  );

  const selectedCourse = allCourses.find((c) => c.id === courseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      toast.error('Please enter a valid 10-digit Indian phone number');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          courseId: courseId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Registration failed');
        return;
      }

      setRegisteredName(name.trim());
      setSuccess(true);
      toast.success('Registration successful!');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <PublicLayout>
        <section className="py-16 sm:py-24">
          <div className="max-w-lg mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 text-green-600 mb-6">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Registration Successful!</h1>
            <p className="mt-3 text-gray-500 leading-relaxed">
              Welcome, <span className="font-semibold text-gray-900">{registeredName}</span>! Your registration has been submitted successfully.
              We will contact you shortly with further details.
            </p>
            {selectedCourse && (
              <Card className="mt-6 border-0 shadow-sm bg-cyan-50/50">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">
                    Enrolled in: <span className="font-semibold text-cyan-700">{selectedCourse.name}</span>
                  </p>
                  {selectedCourse.totalFee > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Course fee: {formatCurrency(selectedCourse.totalFee)}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Our team will confirm your enrollment and share payment details.
                  </p>
                </CardContent>
              </Card>
            )}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/courses">
                <Button variant="outline" className="gap-2 border-cyan-200 text-cyan-700 hover:bg-cyan-50">
                  Browse More Courses
                </Button>
              </Link>
              <Link href="/">
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-cyan-600 to-sky-500 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Student Registration</h1>
          <p className="mt-2 text-cyan-100 text-lg max-w-xl mx-auto">
            Register yourself to enroll in courses and book study cabins
          </p>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-0 shadow-lg shadow-gray-200/50">
            <CardHeader className="pb-2 px-6 pt-6">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-cyan-600" />
                <h2 className="text-lg font-semibold text-gray-900">Fill in Your Details</h2>
              </div>
              <p className="text-sm text-gray-500">
                All fields marked with * are required
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    className="h-11"
                    autoFocus
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      disabled={submitting}
                      className="h-11 pl-9"
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-gray-400">We will use this to contact you</p>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com (optional)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={submitting}
                      className="h-11 pl-9"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Address
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea
                      id="address"
                      placeholder="Your address (optional)"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={submitting}
                      className="pl-9 min-h-[80px] resize-none"
                    />
                  </div>
                </div>

                {/* Course Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Select a Course
                  </Label>
                  {loading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading courses...
                    </div>
                  ) : allCourses.length > 0 ? (
                    <Select value={courseId} onValueChange={setCourseId}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choose a course (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => [
                          <div key={`label-${dept.id}`} className="px-2 py-1.5 text-xs font-semibold text-cyan-600 uppercase tracking-wider">
                            {dept.name}
                          </div>,
                          ...dept.courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                                <span>{course.name}</span>
                                <span className="text-xs text-gray-400">
                                  {formatCurrency(course.totalFee)}
                                </span>
                              </div>
                            </SelectItem>
                          )),
                        ])}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-gray-400">No courses available at the moment</p>
                  )}
                  {selectedCourse && (
                    <Card className="bg-cyan-50/50 border-cyan-100">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-cyan-800">{selectedCourse.name}</p>
                            <p className="text-xs text-cyan-600">{selectedCourse.departmentName}</p>
                          </div>
                          <span className="text-sm font-bold text-cyan-700">
                            {formatCurrency(selectedCourse.totalFee)}
                          </span>
                        </div>
                        {selectedCourse.duration && (
                          <p className="text-xs text-gray-500 mt-1">Duration: {selectedCourse.duration}</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-base"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      Register Now
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-400 text-center">
                  By registering, you agree to be contacted by Lamka Coaching Center regarding courses and admissions.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-cyan-600 animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
