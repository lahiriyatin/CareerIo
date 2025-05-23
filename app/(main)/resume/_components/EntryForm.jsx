"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { entrySchema } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Sparkles, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { improveWithAI } from "@/actions/resume";
import useFetch from "@/hooks/useFetch";
import { toast } from "sonner";
import { format, parse } from "date-fns";

const formatDisplayDate = (dateString) => {
  if (!dateString) return "";

  const date = parse(dateString, "yyyy-MM", new Date());
  return format(date, "MMM yyyy");
};

const EntryForm = ({ type, entries, onChange }) => {
  const [isAdding, setIsAdding] = useState(false);

  const {
    register,
    handleSubmit: handleValidation,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      title: "",
      organization: "",
      startDate: "",
      endDate: "",
      description: "",
      current: false,
    },
  });
  const current = watch("current");

  const {
    loading: isImproving,
    fn: improveWithAIFn,
    data: improvedContent,
    error: improveError,
  } = useFetch(improveWithAI);

  const handleAdd = handleValidation((data) => {
    const formattedEntry = {
      ...data,
      startDate: formatDisplayDate(data.startDate),
      endDate: data.current ? "" : formatDisplayDate(data.endDate),
    };

    onChange([...entries, formattedEntry]);
    reset();
    setIsAdding(false);
  });

  const handleDelete = (index) => {
    const newEntries = entries.filter((_, i) => i !== index);
    onChange(newEntries);
  };

  const handleImproveDescription = async () => {
    const organization = watch("organization");
    if (!organization) {
      toast.error("Organization is required to improve");
      return;
    }
    const description = watch("description");
    if (!description) {
      toast.error("Description is required to improve");
      return;
    }
    await improveWithAIFn({
      organization,
      current: description,
      type: type.toLowerCase(),
    });
  };

  useEffect(() => {
    if (improvedContent && !isImproving) {
      setValue("description", improvedContent);
      toast.success("Description improved successfully");
    }
    if (improveError) {
      toast.error(improveError.message || "Failed to improve description");
    }
  }, [improvedContent, isImproving, improveError]);

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {entries.map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {item.title} @ {item.organization}
              </CardTitle>
              <Button
                className="cursor-pointer"
                variant="outline"
                size="icon"
                type="button"
                onClick={() => handleDelete(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {item.current
                  ? `${item.startDate} - Present`
                  : `${item.startDate} - ${item.endDate}`}
              </p>
              <p className="mt-2 text-sm whitespace-pre-wrap">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Add {type}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  placeholder={
                    type === "Experience"
                      ? "Title/Position"
                      : type === "Education"
                        ? "Degree"
                        : type === "Project"
                          ? "Project Name"
                          : "Title"
                  }
                  {...register("title")}
                  error={errors.title}
                />
                {errors.title && (
                  <p className=" text-sm text-red-500">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Input
                  placeholder={`${type === "Experience" ? "Organization/Company" : type === "Education" ? "Institution" : type==="Project" ? "Company/Solo" : "Organization"}`}
                  {...register("organization")}
                  error={errors.organization}
                />
                {errors.organization && (
                  <p className=" text-sm text-red-500">
                    {errors.organization.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  type="month"
                  {...register("startDate")}
                  error={errors.startDate}
                />
                {errors.startDate && (
                  <p className=" text-sm text-red-500">
                    {errors.startDate.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  type="month"
                  {...register("endDate")}
                  disabled={current}
                  error={errors.endDate}
                />
                {errors.endDate && (
                  <p className=" text-sm text-red-500">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="current"
                {...register("current")}
                onChange={(e) => {
                  setValue("current", e.target.checked);
                  if (e.target.checked) {
                    setValue("endDate", "");
                  }
                }}
              />
              <label htmlFor="current"> Current {type}</label>
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder={`Description of your ${type.toLowerCase()}`}
                className="h-32"
                {...register("description")}
                error={errors.description}
              />
              {errors.description && (
                <p className=" text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <Button
              className="cursor-pointer"
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleImproveDescription}
              disabled={
                isImproving || !watch("description") || !watch("organization")
              }
            >
              {isImproving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Improving...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4 text-pink-700" /> Improve
                  with AI
                </>
              )}
            </Button>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              className="cursor-pointer"
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setIsAdding(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAdd}
              className="cursor-pointer"
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Add Entry
            </Button>
          </CardFooter>
        </Card>
      )}

      {!isAdding && (
        <Button
          className=" w-full cursor-pointer"
          variant="outline"
          onClick={() => setIsAdding(true)}
        >
          <PlusCircle className=" h-4 w-4 mr-2" />
          Add {type}
        </Button>
      )}
    </div>
  );
};
export default EntryForm;
