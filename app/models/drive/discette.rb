module Drive
  class Discette < ActiveRecord::Base
    self.table_name = "discettes"

    # has_many :sections

    serialize :meta, JSON


  end
end
